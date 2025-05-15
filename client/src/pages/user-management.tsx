import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash, ShieldAlert, User as UserIcon } from "lucide-react";
import { InsertUser, User } from "@shared/sqlite-schema";

import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Format date string to a readable format
function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
}

export default function UserManagement() {
  const { toast } = useToast();
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<InsertUser>>({
    username: "",
    password: "",
    name: "",
    role: "user"
  });
  
  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/users'],
  });
  
  const handleAddUser = () => {
    setSelectedUser(null);
    setFormData({
      username: "",
      password: "",
      name: "",
      role: "user"
    });
    setUserDialogOpen(true);
  };
  
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      name: user.name,
      role: user.role,
      // Don't set password - we'll leave it blank for editing
    });
    setUserDialogOpen(true);
  };
  
  const handleDeleteUser = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }
    
    try {
      await apiRequest("DELETE", `/api/users/${id}`, {});
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User deleted",
        description: "User has been successfully removed",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete user",
      });
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRoleChange = (role: string) => {
    setFormData(prev => ({ ...prev, role }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedUser) {
        // Edit existing user
        const updateData = { ...formData };
        // If password is empty, remove it from the update data
        if (!updateData.password) {
          delete updateData.password;
        }
        
        await apiRequest("PUT", `/api/users/${selectedUser.id}`, updateData);
        toast({
          title: "User updated",
          description: "User information has been updated successfully",
        });
      } else {
        // Add new user
        await apiRequest("POST", "/api/users", formData);
        toast({
          title: "User added",
          description: "New user has been created successfully",
        });
      }
      
      // Refresh user list and close dialog
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setUserDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: selectedUser ? "Update failed" : "Creation failed",
        description: error instanceof Error ? error.message : "Failed to process user",
      });
    }
  };
  
  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage user accounts and permissions"
        actions={
          <Button onClick={handleAddUser}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        }
      />
      
      <Card className="mt-6">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-10">Loading users...</div>
          ) : !users || users.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-neutral-500 mb-4">No users found</p>
              <Button onClick={handleAddUser}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First User
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center mr-3">
                          {user.role === 'admin' ? (
                            <ShieldAlert className="h-4 w-4 text-primary" />
                          ) : (
                            <UserIcon className="h-4 w-4 text-neutral-500" />
                          )}
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedUser ? "Edit User" : "Add New User"}</DialogTitle>
            <DialogDescription>
              {selectedUser 
                ? "Update user information and permissions" 
                : "Create a new user account with specific permissions"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Username
                </Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username || ""}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                  disabled={!!selectedUser} // Can't change username for existing users
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password || ""}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required={!selectedUser} // Required for new users only
                  placeholder={selectedUser ? "Leave blank to keep unchanged" : ""}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select 
                  value={formData.role} 
                  onValueChange={handleRoleChange}
                  required
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setUserDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {selectedUser ? "Save Changes" : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}